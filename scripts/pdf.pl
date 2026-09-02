#!/usr/bin/env perl
use strict;
use warnings;
sub esc { my $s=shift; $s=~s/\\/\\\\/g; $s=~s/\(/\\(/g; $s=~s/\)/\\)/g; $s }
sub wrap {
  my ($t,$w)=(shift,84);
  my @o;
  for my $p (split /\n/, $t) {
    if ($p eq '' || $p =~ /^#/) { push @o,$p; next }
    my $line='';
    for my $word (split /\s+/, $p) {
      if (length($line)+length($word)+1 > $w) { push @o,$line; $line=$word }
      else { $line = $line eq '' ? $word : "$line $word" }
    }
    push @o,$line if $line ne '';
  }
  @o
}
my $title=shift;
my $sub=shift;
my $out=shift;
my $text=do { local $/; <> };
my @lines=wrap($text);
my @pages; my @buf; my $max=18;
for my $ln (@lines) {
  if (@buf>=$max) { push @pages,[@buf]; @buf=() }
  push @buf,$ln;
}
push @pages,[@buf] if @buf;
my $n=@pages;
my $id=0; my %obj;
sub add { $id++; $obj{$id}=shift; $id }
my $catalog=add("");
my $pages=add("");
my $font=add("<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>\n");
my @kids;
for my $pi (0..$#pages) {
  my $cid=add("");
  my $pid=add("");
  push @kids,$pid;
  my @ops=("BT","/F1 11 Tf","14 TL","1 0 0 1 54 738 Tm");
  push @ops, "(".esc("Maurice Garcia | $title").") Tj","T*";
  push @ops, "/F1 9 Tf","(".esc("mauricegarcia.com  page ".($pi+1)." / $n").") Tj","T*","T*";
  if ($pi==0) {
    push @ops,"/F1 18 Tf","(".esc($title).") Tj","T*","/F1 11 Tf","(".esc($sub).") Tj","T*","T*";
  }
  push @ops,"/F1 11 Tf";
  for my $ln (@{$pages[$pi]}) {
    if ($ln =~ /^# (.*)/) {
      push @ops,"T*","/F1 13 Tf","(".esc($1).") Tj","T*","/F1 11 Tf";
    } else {
      my $t=$ln eq '' ? ' ' : $ln;
      push @ops,"(".esc($t).") Tj","T*";
    }
  }
  push @ops,"ET";
  my $stream=join("\n",@ops)."\n";
  $obj{$cid}="<< /Length ".length($stream)." >>\nstream\n${stream}endstream\n";
  $obj{$pid}="<< /Type /Page /Parent $pages 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 $font 0 R >> >> /Contents $cid 0 R >>\n";
}
my $kids=join(' ', map { "$_ 0 R" } @kids);
$obj{$pages}="<< /Type /Pages /Kids [ $kids ] /Count $n >>\n";
$obj{$catalog}="<< /Type /Catalog /Pages $pages 0 R >>\n";
my $pdf="%PDF-1.4\n";
my @off=(0);
for my $i (1..$id) {
  $off[$i]=length($pdf);
  $pdf.="$i 0 obj\n$obj{$i}";
  $pdf.="\n" unless $obj{$i}=~/\n$/;
  $pdf.="endobj\n";
}
my $xref=length($pdf);
$pdf.=sprintf("xref\n0 %d\n",$id+1);
$pdf.="0000000000 65535 f \n";
for my $i (1..$id) { $pdf.=sprintf("%010d 00000 n \n",$off[$i]) }
$pdf.="trailer\n<< /Size ".($id+1)." /Root $catalog 0 R >>\nstartxref\n$xref\n%%EOF\n";
open my $fh, '>:raw', $out or die $out;
print $fh $pdf; close $fh;
print "wrote $out ".length($pdf)." bytes $n pages\n";
